const fs = require('fs');
const path = require('path');

// SKRYPT 1: UZUPEŁNIENIE CLIENTS.JSON O POLA FIRMOWE I SERWISOWE

console.log('🔧 SKRYPT 1: Uzupełnianie danych klientów...');

const clientsFile = path.join(__dirname, 'data', 'clients.json');
const clients = JSON.parse(fs.readFileSync(clientsFile, 'utf8'));

console.log(`📋 Znaleziono ${clients.length} klientów do aktualizacji`);

const updatedClients = clients.map((client, index) => {
    console.log(`⚙️  Aktualizuję klienta ${index + 1}/${clients.length}: ${client.name}`);
    
    return {
        ...client,
        
        // INFORMACJE FIRMOWE (jeśli brakuje)
        companyInfo: client.companyInfo || {
            isCompany: Math.random() > 0.7, // 30% szansy na firmę
            name: client.name.includes('Sp.') || client.name.includes('Ltd') ? client.name : null,
            nip: client.name.includes('Sp.') ? `${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
            regon: client.name.includes('Sp.') ? `${Math.floor(Math.random() * 900000000) + 100000000}` : null,
            industry: client.name.includes('Sp.') ? 
                ['handel', 'usługi', 'produkcja', 'IT', 'gastronomia'][Math.floor(Math.random() * 5)] : null,
            contactPerson: client.name.includes('Sp.') ? client.name.split(' ')[0] + ' ' + client.name.split(' ')[1] : null
        },
        
        // PREFERENCJE SERWISOWE
        servicePreferences: client.servicePreferences || {
            preferredContactMethod: ['phone', 'email', 'sms'][Math.floor(Math.random() * 3)],
            preferredTimeSlots: [
                ['morning', 'afternoon'][Math.floor(Math.random() * 2)],
                Math.random() > 0.5 ? ['morning', 'afternoon'][Math.floor(Math.random() * 2)] : null
            ].filter(Boolean),
            paymentMethod: ['cash', 'card', 'transfer', 'invoice'][Math.floor(Math.random() * 4)],
            specialRequirements: [
                'Dzwonić 15 min przed przyjazdem',
                'Preferowane terminy popołudniowe',
                'Dostęp przez bramę - dzwonić do domofonu',
                'Można zostawić urządzenie bez obecności klienta',
                null
            ][Math.floor(Math.random() * 5)],
            communicationLanguage: 'pl',
            serviceReminders: true,
            marketingConsent: Math.random() > 0.3
        },
        
        // INFORMACJE SERWISOWE (rozszerzone)
        serviceInfo: {
            ...client.serviceInfo,
            customerSince: client.dateAdded || "2024-01-15",
            totalOrders: Math.floor(Math.random() * 20) + 1,
            totalSpent: Math.floor(Math.random() * 5000) + 200,
            lastServiceDate: client.lastServiceDate || null,
            averageOrderValue: Math.floor(Math.random() * 800) + 150,
            creditLimit: [0, 500, 1000, 2000][Math.floor(Math.random() * 4)],
            discount: [0, 5, 10, 15][Math.floor(Math.random() * 4)],
            loyalty: {
                level: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
                points: Math.floor(Math.random() * 1000),
                nextLevelRequirement: Math.floor(Math.random() * 500) + 100
            }
        },
        
        // PREFERENCJE KONTAKTU (rozszerzone)
        contactPreferences: client.contactPreferences || {
            bestTimeToCall: [
                'morning (8-12)',
                'afternoon (12-16)', 
                'evening (16-20)',
                'anytime'
            ][Math.floor(Math.random() * 4)],
            communicationFrequency: ['minimal', 'standard', 'frequent'][Math.floor(Math.random() * 3)],
            emergencyContact: Math.random() > 0.7 ? {
                name: client.name + ' (backup)',
                phone: client.phone.replace(/.$/, Math.floor(Math.random() * 10)),
                relationship: ['spouse', 'family', 'colleague'][Math.floor(Math.random() * 3)]
            } : null
        },
        
        // METADANE (aktualizowane)
        metadata: {
            ...client.metadata,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: 'enhancement-script-v1',
            version: (client.metadata?.version || 0) + 1,
            isActive: true,
            dataCompleteness: 'enhanced',
            enhancementDate: new Date().toISOString()
        }
    };
});

// Zapisz zaktualizowane dane
fs.writeFileSync(clientsFile, JSON.stringify(updatedClients, null, 2));

console.log('✅ UKOŃCZONO: Aktualizacja clients.json');
console.log(`📊 Zaktualizowano ${updatedClients.length} klientów`);
console.log(`📋 Dodano pola: companyInfo, servicePreferences, contactPreferences, loyalty`);
console.log(`💾 Plik zapisany: ${clientsFile}`);
console.log('');

// STATYSTYKI
const companiesCount = updatedClients.filter(c => c.companyInfo?.isCompany).length;
const cashPayersCount = updatedClients.filter(c => c.servicePreferences?.paymentMethod === 'cash').length;
const phonePreferredCount = updatedClients.filter(c => c.servicePreferences?.preferredContactMethod === 'phone').length;

console.log('📈 STATYSTYKI:');
console.log(`🏢 Firmy: ${companiesCount} (${Math.round(companiesCount/updatedClients.length*100)}%)`);
console.log(`💰 Płatność gotówką: ${cashPayersCount} (${Math.round(cashPayersCount/updatedClients.length*100)}%)`);  
console.log(`📞 Preferują telefon: ${phonePreferredCount} (${Math.round(phonePreferredCount/updatedClients.length*100)}%)`);
console.log('');
console.log('🎯 NASTĘPNY KROK: Uruchom skrypt 2 - aktualizację employees.json');