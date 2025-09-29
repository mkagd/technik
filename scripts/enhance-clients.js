#!/usr/bin/env node

/**
 * 🚀 CLIENT ENHANCEMENT MIGRATION SCRIPT
 * 
 * Rozszerza istniejącą strukturę klientów o nowe pola:
 * - phones[] (multiple telefony)
 * - addresses[] (multiple adresy) 
 * - notes[] (notatki)
 * - tags[] (tagi)
 * - availability (dostępność)
 * - companyInfo (dane firmowe)
 * - preferences (preferencje)
 * - stats (statystyki)
 * - contactHistory (historia kontaktów)
 * 
 * Zachowuje pełną kompatybilność wsteczną z istniejącym kodem.
 */

const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, '..', 'data', 'clients.json');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Sprawdź czy plik istnieje
if (!fs.existsSync(CLIENTS_FILE)) {
    console.error('❌ Plik clients.json nie istnieje:', CLIENTS_FILE);
    process.exit(1);
}

// Stwórz katalog backup jeśli nie istnieje
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Stwórz backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `clients-before-enhancement-${timestamp}.json`);

console.log('📦 Tworzenie backupu...');
const originalData = fs.readFileSync(CLIENTS_FILE, 'utf8');
fs.writeFileSync(backupFile, originalData);
console.log('✅ Backup utworzony:', backupFile);

// Wczytaj dane
const clients = JSON.parse(originalData);
console.log('📊 Znaleziono klientów:', clients.length);

// Funkcja do konwersji klienta na rozszerzoną strukturę
function enhanceClient(client) {
    // Sprawdź czy już rozszerzony
    if (client.enhanced) {
        console.log(`⏭️  Klient ${client.id} już rozszerzony, pomijam`);
        return client;
    }

    const enhanced = {
        ...client, // zachowaj wszystkie istniejące pola
        
        // MULTIPLE TELEFONY
        phones: [
            {
                number: client.phone || '',
                label: 'Główny',
                isPrimary: true,
                notes: 'Przeniesiony z pola phone'
            }
        ],
        
        // MULTIPLE ADRESY  
        addresses: [
            {
                address: client.address || '',
                label: 'Główny',
                isPrimary: true,
                coordinates: null,
                notes: client.street && client.street !== 'Nie podano' 
                    ? `Ulica: ${client.street}, Miasto: ${client.city}` 
                    : `Miasto: ${client.city}`
            }
        ],
        
        // NOTATKI
        notes: [
            {
                id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                content: generateInitialNote(client),
                type: 'general',
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            }
        ],
        
        // TAGI (wygenerowane na podstawie danych)
        tags: generateTags(client),
        
        // DOSTĘPNOŚĆ
        availability: {
            workingHours: [
                {
                    dayOfWeek: 'monday',
                    periods: [{ from: '17:00', to: '19:00', label: 'Po pracy' }]
                },
                {
                    dayOfWeek: 'tuesday', 
                    periods: [{ from: '17:00', to: '19:00', label: 'Po pracy' }]
                },
                {
                    dayOfWeek: 'wednesday',
                    periods: [{ from: '17:00', to: '19:00', label: 'Po pracy' }]
                },
                {
                    dayOfWeek: 'thursday',
                    periods: [{ from: '17:00', to: '19:00', label: 'Po pracy' }]
                },
                {
                    dayOfWeek: 'friday',
                    periods: [{ from: '17:00', to: '19:00', label: 'Po pracy' }]
                },
                {
                    dayOfWeek: 'saturday',
                    periods: [{ from: '09:00', to: '15:00', label: 'Weekend' }]
                }
            ],
            specialAvailability: [],
            unavailableDates: [],
            preferredContactTime: 'Po 17:00',
            notes: 'Standardowa dostępność po godzinach pracy'
        },
        
        // DANE FIRMOWE
        companyInfo: {
            isCompany: detectIfCompany(client),
            companyName: detectIfCompany(client) ? client.name : '',
            nip: '',
            regon: '',
            krs: ''
        },
        
        // PREFERENCJE
        preferences: {
            preferredPaymentMethod: 'cash',
            invoiceRequired: false,
            preferredCommunication: 'phone',
            language: 'pl'
        },
        
        // STATYSTYKI (domyślne wartości)
        stats: {
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
            customerSince: client.dateAdded || new Date().toISOString()
        },
        
        // HISTORIA KONTAKTÓW
        contactHistory: client.history && client.history.length > 0 
            ? client.history.map((item, index) => ({
                id: `contact_${Date.now()}_${index}`,
                date: item.date || new Date().toISOString(),
                type: 'note',
                direction: 'system',
                duration: null,
                notes: item.note || 'Przeniesione z history',
                result: 'logged'
            }))
            : [],
        
        // METADATA ROZSZERZENIA
        enhanced: true,
        enhancedDate: new Date().toISOString(),
        enhancedVersion: '1.0'
    };
    
    return enhanced;
}

// Pomocnicze funkcje
function generateInitialNote(client) {
    const parts = [];
    
    if (client.email) {
        parts.push(`Email: ${client.email}`);
    }
    
    if (client.city && client.city !== 'Nie podano') {
        parts.push(`Miasto: ${client.city}`);
    }
    
    if (client.dateAdded) {
        const addedDate = new Date(client.dateAdded).toLocaleDateString('pl-PL');
        parts.push(`Klient od: ${addedDate}`);
    }
    
    return parts.length > 0 
        ? `Klient zarejestrowany w systemie. ${parts.join(', ')}`
        : 'Klient zarejestrowany w systemie';
}

function generateTags(client) {
    const tags = [];
    
    // Tag na podstawie miasta
    if (client.city && client.city !== 'Nie podano') {
        tags.push(client.city);
    }
    
    // Tag na podstawie daty dodania
    if (client.dateAdded) {
        const addedDate = new Date(client.dateAdded);
        const currentDate = new Date();
        const monthsDiff = (currentDate.getFullYear() - addedDate.getFullYear()) * 12 + 
                          (currentDate.getMonth() - addedDate.getMonth());
        
        if (monthsDiff >= 12) {
            tags.push('Stały klient');
        } else if (monthsDiff >= 6) {
            tags.push('Regularny klient');
        } else {
            tags.push('Nowy klient');
        }
    }
    
    // Tag na podstawie nazwy (firma vs osoba)
    if (detectIfCompany(client)) {
        tags.push('Firma');
    } else {
        tags.push('Osoba prywatna');
    }
    
    // Tag na podstawie email
    if (client.email && client.email.includes('@gmail.com')) {
        tags.push('Gmail');
    }
    
    return tags;
}

function detectIfCompany(client) {
    const companyKeywords = [
        'sp. z o.o', 'spółka', 'firma', 'przedsiębiorstwo', 
        'zakład', 'kręgielnia', 'restauracja', 'hotel',
        'sklep', 'market', 'centrum', 'galeria'
    ];
    
    const name = (client.name || '').toLowerCase();
    return companyKeywords.some(keyword => name.includes(keyword));
}

// GŁÓWNA PĘTLA MIGRACJI
console.log('🔄 Rozpoczynam rozszerzanie struktury klientów...');

const enhancedClients = clients.map((client, index) => {
    console.log(`📝 Przetwarzam klienta ${index + 1}/${clients.length}: ${client.name} (${client.id})`);
    return enhanceClient(client);
});

// Zapisz rozszerzone dane
console.log('💾 Zapisuję rozszerzone dane...');
fs.writeFileSync(CLIENTS_FILE, JSON.stringify(enhancedClients, null, 2));

// Podsumowanie
const newlyEnhanced = enhancedClients.filter(c => c.enhanced && c.enhancedDate).length;
const alreadyEnhanced = enhancedClients.length - newlyEnhanced;

console.log('\n🎉 MIGRACJA ZAKOŃCZONA POMYŚLNIE!');
console.log('═══════════════════════════════════');
console.log(`📊 Łącznie klientów: ${enhancedClients.length}`);
console.log(`✅ Nowo rozszerzonych: ${newlyEnhanced}`);
console.log(`⏭️  Już rozszerzonych: ${alreadyEnhanced}`);
console.log(`📦 Backup: ${backupFile}`);
console.log('\n🔍 NOWE POLA DODANE:');
console.log('   • phones[] - multiple telefony');  
console.log('   • addresses[] - multiple adresy');
console.log('   • notes[] - notatki z datami');
console.log('   • tags[] - tagi kategoryzujące');
console.log('   • availability - harmonogram dostępności'); 
console.log('   • companyInfo - dane firmowe');
console.log('   • preferences - preferencje klienta');
console.log('   • stats - statystyki zamówień');
console.log('   • contactHistory - historia kontaktów');
console.log('\n✅ Kompatybilność wsteczna zachowana!');

process.exit(0);