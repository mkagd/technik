// utils/clientOrderStorage.js
// System przechowywania danych zgodny z aplikacją mobilną (ClientsContext + OrdersContext)
// ENHANCED WITH PROFESSIONAL FILE LOCKING + ADVANCED CACHING + UNIFIED ID SYSTEM

import fs from 'fs';
import path from 'path';
import { LockedFileOperations } from './fileLocking.js';
import { 
    generateClientId, 
    generateOrderId, 
    generateVisitId 
} from './id-generator.js';

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

// Odczytaj klientów z pliku - THREAD-SAFE VERSION
export const readClients = async () => {
    try {
        ensureDataDir();
        const clients = await LockedFileOperations.readJSON(CLIENTS_FILE, []);
        return clients;
    } catch (error) {
        console.error('🔒 Błąd odczytu klientów:', error);
        return [];
    }
};

// Zapisz klientów do pliku - THREAD-SAFE VERSION
export const writeClients = async (clients) => {
    try {
        ensureDataDir();
        await LockedFileOperations.writeJSON(CLIENTS_FILE, clients);
        return true;
    } catch (error) {
        console.error('🔒 Błąd zapisu klientów:', error);
        return false;
    }
};

// Dodaj nowego klienta - ATOMIC OPERATION WITH LOCKING
export const addClient = async (clientData, metadata = {}) => {
    try {
        ensureDataDir();
        const clients = await readClients();
        
        const newClient = await LockedFileOperations.updateJSON(CLIENTS_FILE, async (clients) => {
            // Generuj nowe CLI ID ze źródłem
            const source = metadata.source || 'system-auto';
            const newId = generateClientId(clients, new Date(), source);
            const now = new Date().toISOString();

            const clientToAdd = {
                ...clientData,
                id: newId,
                clientId: newId,  // Duplicate dla kompatybilności
                
                // METADANE ŹRÓDŁA:
                source: source,
                sourceCode: source.length === 1 ? source : undefined,
                sourceDetails: metadata.sourceDetails || null,
                createdBy: metadata.createdBy || 'system',
                createdByName: metadata.createdByName || 'System',
                userId: metadata.userId || null,  // Dla zalogowanych klientów
                isAuthenticated: metadata.isAuthenticated || false,
                createdFromIP: metadata.ip || null,
                
                // TIMESTAMPS:
                dateAdded: now,
                createdAt: now,
                updatedAt: now,
                updatedBy: null,
                
                // HISTORIA:
                history: clientData.history || [],
                
                // DOMYŚLNA DOSTĘPNOŚĆ (jeśli nie podano)
                physicalAvailability: clientData.physicalAvailability || {
                    timeWindows: [
                        {
                            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                            timeFrom: '08:00',
                            timeTo: '20:00',
                            label: 'Dni robocze'
                        },
                        {
                            days: ['saturday'],
                            timeFrom: '09:00',
                            timeTo: '18:00',
                            label: 'Sobota'
                        }
                    ],
                    preferences: {
                        flexibleSchedule: true,
                        requiresAdvanceNotice: true,
                        advanceNoticeHours: 24
                    },
                    presenceHistory: [],
                    stats: {},
                    score: 85,
                    category: 'weekdays',
                    notes: [],
                    lastUpdated: now
                }
            };

            clients.push(clientToAdd);
            
            return clients;
        }, []);

        // Zwróć ostatniego dodanego klienta
        const allClients = await LockedFileOperations.readJSON(CLIENTS_FILE, []);
        return allClients[allClients.length - 1];
    } catch (error) {
        console.error('🔒 Błąd dodawania klienta:', error);
        return null;
    }
};

// Aktualizuj klienta - ATOMIC OPERATION WITH LOCKING
export const updateClient = async (updatedClient) => {
    try {
        const result = await LockedFileOperations.updateJSON(CLIENTS_FILE, async (clients) => {
            const index = clients.findIndex(c => c.id === updatedClient.id);
            if (index !== -1) {
                clients[index] = updatedClient;
                return clients;
            }
            throw new Error('Client not found');
        }, []);

        return updatedClient;
    } catch (error) {
        console.error('🔒 Błąd aktualizacji klienta:', error);
        return null;
    }
};

// Usuń klienta - ATOMIC OPERATION WITH LOCKING
export const deleteClient = async (clientId) => {
    try {
        await LockedFileOperations.updateJSON(CLIENTS_FILE, async (clients) => {
            const filteredClients = clients.filter(c => c.id !== clientId);
            return filteredClients;
        }, []);
        
        return true;
    } catch (error) {
        console.error('🔒 Błąd usuwania klienta:', error);
        return false;
    }
};

// Dodaj kontakt z klientem do historii - ATOMIC OPERATION WITH LOCKING
export const logClientContact = async (clientId, type, source = 'WebApp') => {
    try {
        const updatedClient = await LockedFileOperations.updateJSON(CLIENTS_FILE, async (clients) => {
            const clientIndex = clients.findIndex(c => c.id === clientId);
            if (clientIndex === -1) throw new Error('Client not found');

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
            return clients;
        }, []);

        // Return updated client
        const allClients = await readClients();
        return allClients.find(c => c.id === clientId);
    } catch (error) {
        console.error('🔒 Błąd dodawania kontaktu do historii:', error);
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

// Odczytaj zamówienia z pliku - THREAD-SAFE VERSION
export const readOrders = async () => {
    try {
        ensureDataDir();
        // Użyj bezpośredniego odczytu jeśli locking nie działa
        if (fs.existsSync(ORDERS_FILE)) {
            const data = fs.readFileSync(ORDERS_FILE, 'utf8');
            const orders = JSON.parse(data);
            return orders;
        }
        return [];
    } catch (error) {
        console.error('❌ Błąd odczytu zamówień:', error);
        return [];
    }
};

// Zapisz zamówienia do pliku - THREAD-SAFE VERSION
export const writeOrders = async (orders) => {
    try {
        ensureDataDir();
        await LockedFileOperations.writeJSON(ORDERS_FILE, orders);
        return true;
    } catch (error) {
        console.error('🔒 Błąd zapisu zamówień:', error);
        return false;
    }
};

// Dodaj nowe zamówienie - ATOMIC OPERATION WITH LOCKING + UNIFIED ID SYSTEM
export const addOrder = async (newOrder, metadata = {}) => {
    try {
        ensureDataDir();
        const addedOrder = await LockedFileOperations.updateJSON(ORDERS_FILE, async (orders) => {
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

            // Generuj orderNumber jeśli nie został podany (ze źródłem!)
            const source = metadata.source || newOrder.source || 'system-auto';
            const orderNumber = newOrder.orderNumber || generateOrderId(orders, new Date(), source);
            const now = new Date().toISOString();

            const orderToAdd = {
                ...newOrder,
                id: newOrder.id || Date.now(),
                orderNumber: orderNumber,
                devices,
                builtInParams: devices[0]?.builtInParams || { ...DEFAULT_BUILTIN_OPTIONS },
                
                // METADANE ŹRÓDŁA:
                source: source,
                sourceCode: source.length === 1 ? source : undefined,
                sourceDetails: metadata.sourceDetails || newOrder.sourceDetails || null,
                createdBy: metadata.createdBy || newOrder.createdBy || 'system',
                createdByName: metadata.createdByName || newOrder.createdByName || 'System',
                userId: metadata.userId || newOrder.userId || null,  // Dla zalogowanych klientów
                isUserCreated: metadata.isUserCreated || newOrder.isUserCreated || false,
                createdFromIP: metadata.ip || null,
                
                // TIMESTAMPS:
                dateAdded: now,
                createdAt: now,
                updatedAt: now,
                updatedBy: null
            };

            orders.push(orderToAdd);
            return orders;
        }, []);

        // Return the newly added order (ostatni w tablicy)
        const orders = await LockedFileOperations.readJSON(ORDERS_FILE, []);
        return orders[orders.length - 1];
    } catch (error) {
        console.error('🔒 Błąd dodawania zamówienia:', error);
        return null;
    }
};

// Patch zamówienia - ATOMIC OPERATION WITH LOCKING
export const patchOrder = async (id, patch) => {
    try {
        let patchedOrder = null;
        await LockedFileOperations.updateJSON(ORDERS_FILE, async (orders) => {
            const orderIndex = orders.findIndex(order => String(order.id) === String(id));

            if (orderIndex === -1) throw new Error('Order not found');

            const merged = {
                ...orders[orderIndex],
                ...patch,
                dates: patch.dates ? patch.dates : orders[orderIndex].dates,
                hours: patch.hours !== undefined ? patch.hours : orders[orderIndex].hours,
                end: patch.end !== undefined ? patch.end : orders[orderIndex].end,
            };

            if (patch.dates) merged.dates = [...patch.dates];
            
            // ✅ KRYTYCZNE: Upewnij się że visits[] jest prawidłowo skopiowane
            if (patch.visits) {
                merged.visits = [...patch.visits];
            }

            orders[orderIndex] = merged;
            patchedOrder = merged;
            return orders;
        }, []);

        return patchedOrder;
    } catch (error) {
        console.error('🔒 Błąd aktualizacji zamówienia:', error);
        return null;
    }
};

// Aktualizuj zamówienie - ATOMIC OPERATION WITH LOCKING
export const updateOrder = async (updatedOrder) => {
    try {
        let finalOrder = null;
        const result = await LockedFileOperations.updateJSON(ORDERS_FILE, async (orders) => {
            const index = orders.findIndex(order => order.id === updatedOrder.id);
            if (index !== -1) {
                // ✅ MERGE zamiast REPLACE - zachowaj wszystkie istniejące pola
                orders[index] = {
                    ...orders[index],      // Zachowaj wszystkie stare dane
                    ...updatedOrder,       // Nadpisz tylko nowe pola
                    id: orders[index].id   // Zabezpiecz ID (nie może się zmienić)
                };
                finalOrder = orders[index];  // Zwróć pełny obiekt
                return orders;
            }
            throw new Error('Order not found');
        }, []);

        return finalOrder;  // Zwróć pełny zaktualizowany obiekt
    } catch (error) {
        console.error('🔒 Błąd aktualizacji zamówienia:', error);
        return null;
    }
};

// Usuń zamówienie - ATOMIC OPERATION WITH LOCKING
export const deleteOrder = async (orderId) => {
    try {
        // Konwertuj orderId na number jeśli jest string (z query params)
        const orderIdNum = typeof orderId === 'string' ? parseInt(orderId) : orderId;
        
        await LockedFileOperations.updateJSON(ORDERS_FILE, async (orders) => {
            const initialCount = orders.length;
            const filteredOrders = orders.filter(order => {
                // Porównaj zarówno id (number) jak i orderNumber (string)
                return order.id !== orderIdNum && order.id !== orderId && order.orderNumber !== orderId;
            });
            
            const deletedCount = initialCount - filteredOrders.length;
            if (deletedCount > 0) {
            } else {
            }
            
            return filteredOrders;
        }, []);
        
        return true;
    } catch (error) {
        console.error('🔒 Błąd usuwania zamówienia:', error);
        return false;
    }
};

// === KONWERSJA DANYCH ===

// Konwertuj dane z formularza rezerwacji na format klienta + zamówienia - ENHANCED WITH BATCH LOCKING
export const convertReservationToClientOrder = async (reservationData) => {
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
        history: [],
        // Dodaj tablice wielokrotnych danych
        phones: reservationData.phones || [],
        addresses: reservationData.addresses || [],
        // Dostępność fizyczna klienta
        physicalAvailability: reservationData.physicalAvailability || null,
        // ✅ Zachowaj userId i isAuthenticated
        userId: reservationData.userId || null,
        isAuthenticated: reservationData.isAuthenticated || false
    };

    // Stwórz zamówienie - zgodne ze strukturą orders.json
    const order = {
        clientId: null, // zostanie ustawione po dodaniu klienta
        clientName: client.name,
        clientPhone: client.phone,
        email: client.email,
        address: client.address,
        city: client.city,
        street: client.street,
        postalCode: reservationData.postalCode || '',
        // Dodaj tablice wielokrotnych danych do zamówienia
        phones: reservationData.phones || [],
        addresses: reservationData.addresses || [],
        // 🌍 WSPÓŁRZĘDNE GPS z geocodingu
        clientLocation: reservationData.clientLocation || null,
        latitude: reservationData.clientLocation?.coordinates?.lat || null,
        longitude: reservationData.clientLocation?.coordinates?.lng || null,
        deviceType: reservationData.category || reservationData.device || 'Nie określono',
        brand: reservationData.brand || 'Nie określono',
        model: reservationData.device || 'Nie określono',
        serialNumber: '',
        description: reservationData.problem || reservationData.description || 'Brak opisu',
        priority: reservationData.priority || 'medium',
        status: reservationData.status || 'pending', // 📌 'pending' - nowa rezerwacja oczekująca na przydzielenie
        visits: [], // Puste wizyty na start
        // Pola legacy dla kompatybilności
        category: reservationData.category,
        serviceType: reservationData.serviceType || reservationData.device,
        scheduledDate: reservationData.date || reservationData.scheduledDate,
        scheduledTime: reservationData.scheduledTime,
        availability: reservationData.availability || 'Nie określono',
        devices: (() => {
            // Sprawdź czy devices to tablica obiektów (z admin panel) czy stringów (z formularza)
            if (reservationData.devices && reservationData.devices.length > 0) {
                const firstDevice = reservationData.devices[0];
                
                // Jeśli to obiekt - użyj go bezpośrednio (admin panel format)
                if (typeof firstDevice === 'object' && firstDevice !== null) {
                    return reservationData.devices.map(device => ({
                        name: device.category || device.model || device.brand || 'Nie określono',
                        brand: device.brand || '',
                        model: device.model || '',
                        serialNumber: device.serialNumber || '',
                        description: device.problem || 'Brak opisu',
                        hasBuiltIn: device.hasBuiltIn || false,
                        builtInParams: device.hasBuiltIn ? {
                            ...DEFAULT_BUILTIN_OPTIONS,
                            demontaz: true,
                            montaz: true
                        } : { ...DEFAULT_BUILTIN_OPTIONS },
                        builtInParamsNotes: {}
                    }));
                }
            }
            
            // Format z formularza rezerwacji - brands[], devices[], categories[] jako stringi
            if (reservationData.categories && reservationData.categories.length > 0) {
                return reservationData.categories.map((category, index) => ({
                    name: category || 'Nie określono',
                    brand: reservationData.brands?.[index] || '',
                    model: reservationData.devices?.[index] || '', // devices[] to modele jako stringi
                    serialNumber: '',
                    description: reservationData.problems?.[index] || 'Brak opisu',
                    hasBuiltIn: reservationData.hasBuiltIn?.[index] || false,
                    builtInParams: reservationData.hasBuiltIn?.[index] ? {
                        ...DEFAULT_BUILTIN_OPTIONS,
                        demontaz: reservationData.hasDemontaz?.[index] || true,
                        montaz: reservationData.hasMontaz?.[index] || true,
                        trudna: reservationData.hasTrudnaZabudowa?.[index] || false
                    } : { ...DEFAULT_BUILTIN_OPTIONS },
                    builtInParamsNotes: {}
                }));
            }
            
            // Fallback - pojedyncze urządzenie ze starych pól
            return [{
                name: reservationData.device || reservationData.serviceType || reservationData.category || 'Nie określono',
                brand: reservationData.brand || '',
                model: reservationData.device || '',
                serialNumber: '',
                description: reservationData.problem || reservationData.description || 'Brak opisu',
                hasBuiltIn: reservationData.hasBuiltIn || false,
                builtInParams: reservationData.hasBuiltIn ? {
                    ...DEFAULT_BUILTIN_OPTIONS,
                    demontaz: true,
                    montaz: true
                } : { ...DEFAULT_BUILTIN_OPTIONS },
                builtInParamsNotes: {}
            }];
        })(),
        builtInParams: { ...DEFAULT_BUILTIN_OPTIONS },
        // Dodajemy deviceDetails z informacjami o zabudowie
        deviceDetails: {
            deviceType: (reservationData.category || reservationData.device || '').toLowerCase(),
            hasBuiltIn: reservationData.devices?.[0]?.hasBuiltIn || reservationData.hasBuiltIn || false,
            hasDemontaz: reservationData.devices?.[0]?.hasBuiltIn || reservationData.hasDemontaz || false,
            hasMontaz: reservationData.devices?.[0]?.hasBuiltIn || reservationData.hasMontaz || false,
            hasTrudnaZabudowa: reservationData.hasTrudnaZabudowa || false,
            manualAdditionalTime: 0
        },
        dates: reservationData.scheduledDate ? [reservationData.scheduledDate] : [],
        hours: null,
        end: null
    };

    return { client, order };
};

