#!/usr/bin/env node

/**
 * 🧪 ENHANCED CLIENT STRUCTURE VALIDATOR
 * 
 * Testuje nową rozszerzoną strukturę klientów:
 * - Sprawdza czy wszystkie klienci mają nowe pola
 * - Waliduje strukture phones[], addresses[], notes[], tags[]
 * - Testuje kompatybilność wsteczną
 * - Generuje raport z analizy danych
 */

const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, '..', 'data', 'clients.json');

// Wczytaj dane
if (!fs.existsSync(CLIENTS_FILE)) {
    console.error('❌ Plik clients.json nie istnieje:', CLIENTS_FILE);
    process.exit(1);
}

const clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));

console.log('🔍 WALIDACJA ROZSZERZONEJ STRUKTURY KLIENTÓW');
console.log('═══════════════════════════════════════════════');
console.log(`📊 Łącznie klientów: ${clients.length}`);

let enhancedCount = 0;
let basicCount = 0;
let withMultiplePhones = 0;
let withMultipleAddresses = 0;
let withNotes = 0;
let withTags = 0;
let withAvailability = 0;
let companiesCount = 0;

const validationErrors = [];
const validationWarnings = [];

clients.forEach((client, index) => {
    console.log(`\n📝 Klient ${index + 1}: ${client.name} (${client.id})`);
    
    // Sprawdź czy rozszerzony
    if (client.enhanced) {
        enhancedCount++;
        console.log('  ✅ Status: Rozszerzony');
        
        // WALIDACJA PHONES
        if (client.phones && Array.isArray(client.phones)) {
            console.log(`  📞 Telefony: ${client.phones.length}`);
            if (client.phones.length > 1) withMultiplePhones++;
            
            client.phones.forEach((phone, i) => {
                if (!phone.number) {
                    validationErrors.push(`${client.id}: Telefon ${i} nie ma numeru`);
                }
                if (!phone.label) {
                    validationWarnings.push(`${client.id}: Telefon ${i} nie ma etykiety`);
                }
            });
            
            const primaries = client.phones.filter(p => p.isPrimary);
            if (primaries.length !== 1) {
                validationWarnings.push(`${client.id}: Powinien mieć dokładnie 1 główny telefon, ma ${primaries.length}`);
            }
        } else {
            validationErrors.push(`${client.id}: Brak tablicy phones`);
        }
        
        // WALIDACJA ADDRESSES
        if (client.addresses && Array.isArray(client.addresses)) {
            console.log(`  🏠 Adresy: ${client.addresses.length}`);
            if (client.addresses.length > 1) withMultipleAddresses++;
            
            const primaries = client.addresses.filter(a => a.isPrimary);
            if (primaries.length !== 1) {
                validationWarnings.push(`${client.id}: Powinien mieć dokładnie 1 główny adres, ma ${primaries.length}`);
            }
        } else {
            validationErrors.push(`${client.id}: Brak tablicy addresses`);
        }
        
        // WALIDACJA NOTES
        if (client.notes && Array.isArray(client.notes)) {
            console.log(`  📝 Notatki: ${client.notes.length}`);
            if (client.notes.length > 0) withNotes++;
            
            client.notes.forEach((note, i) => {
                if (!note.id || !note.content || !note.createdAt) {
                    validationErrors.push(`${client.id}: Notatka ${i} ma niepełne dane`);
                }
            });
        }
        
        // WALIDACJA TAGS
        if (client.tags && Array.isArray(client.tags)) {
            console.log(`  🏷️  Tagi: ${client.tags.length} (${client.tags.join(', ')})`);
            if (client.tags.length > 0) withTags++;
        }
        
        // WALIDACJA AVAILABILITY
        if (client.availability) {
            console.log(`  ⏰ Dostępność: ${client.availability.preferredContactTime || 'Nie podano'}`);
            withAvailability++;
        }
        
        // WALIDACJA COMPANY INFO
        if (client.companyInfo && client.companyInfo.isCompany) {
            console.log(`  🏢 Firma: ${client.companyInfo.companyName || client.name}`);
            companiesCount++;
        }
        
        // SPRAWDŹ KOMPATYBILNOŚĆ WSTECZNĄ
        if (client.phone && client.phones) {
            const mainPhoneInArray = client.phones.find(p => p.isPrimary);
            if (!mainPhoneInArray || mainPhoneInArray.number !== client.phone) {
                validationWarnings.push(`${client.id}: Pole phone (${client.phone}) nie zgadza się z głównym phones (${mainPhoneInArray?.number})`);
            }
        }
        
        if (client.address && client.addresses) {
            const mainAddressInArray = client.addresses.find(a => a.isPrimary);
            if (!mainAddressInArray || mainAddressInArray.address !== client.address) {
                validationWarnings.push(`${client.id}: Pole address nie zgadza się z głównym addresses`);
            }
        }
        
    } else {
        basicCount++;
        console.log('  ⚠️  Status: Podstawowy (nierozszerzony)');
    }
});

console.log('\n📊 PODSUMOWANIE WALIDACJI');
console.log('═══════════════════════════');
console.log(`✅ Klienci rozszerzeni: ${enhancedCount}/${clients.length} (${Math.round(enhancedCount/clients.length*100)}%)`);
console.log(`📋 Klienci podstawowi: ${basicCount}/${clients.length} (${Math.round(basicCount/clients.length*100)}%)`);

console.log('\n🔍 ANALIZA ROZSZERZONYCH FUNKCJI:');
console.log(`📞 Z multiple telefonami: ${withMultiplePhones}`);
console.log(`🏠 Z multiple adresami: ${withMultipleAddresses}`);
console.log(`📝 Z notatkami: ${withNotes}`);
console.log(`🏷️  Z tagami: ${withTags}`);
console.log(`⏰ Z dostępnością: ${withAvailability}`);
console.log(`🏢 Firm: ${companiesCount}`);

if (validationErrors.length > 0) {
    console.log('\n❌ BŁĘDY WALIDACJI:');
    validationErrors.forEach(error => console.log(`  • ${error}`));
}

if (validationWarnings.length > 0) {
    console.log('\n⚠️  OSTRZEŻENIA:');
    validationWarnings.forEach(warning => console.log(`  • ${warning}`));
}

console.log('\n🎯 OCENA MIGRACJI:');
if (enhancedCount === clients.length && validationErrors.length === 0) {
    console.log('✅ SUKCES! Wszystkie klienci zostali pomyślnie rozszerzeni bez błędów.');
} else if (enhancedCount === clients.length) {
    console.log('⚠️  CZĘŚCIOWY SUKCES: Wszyscy klienci rozszerzeni, ale są ostrzeżenia.');
} else {
    console.log('❌ MIGRACJA NIEKOMPLETNA: Nie wszyscy klienci zostali rozszerzeni.');
}

console.log('\n✅ Walidacja zakończona');
process.exit(validationErrors.length > 0 ? 1 : 0);