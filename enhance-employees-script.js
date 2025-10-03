const fs = require('fs');
const path = require('path');

// SKRYPT 2: ROZSZERZENIE EMPLOYEES.JSON O SPECJALISTYCZNE DANE AGD

console.log('🔧 SKRYPT 2: Rozszerzanie danych pracowników AGD...');

const employeesFile = path.join(__dirname, 'data', 'employees.json');
const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'));

console.log(`👷 Znaleziono ${employees.length} pracowników do aktualizacji`);

// Baza danych AGD dla pracowników
const agdBrands = ['Samsung', 'LG', 'Bosch', 'Whirlpool', 'Electrolux', 'Siemens', 'Miele'];
const agdTypes = ['pralka', 'zmywarka', 'lodówka', 'piekarnik', 'płyta grzewcza', 'mikrofalówka'];
const certifications = [
    'Samsung Service Professional',
    'LG Authorized Service',
    'Bosch Technical Expert',
    'Bezpieczeństwo elektryczne',
    'Obsługa gazowa',
    'Systemy chłodnicze',
    'Diagnostyka elektroniczna'
];

const tools = [
    'Multimetr Fluke 117',
    'Zestaw kluczy do AGD',
    'Pompa kontroli ciśnienia',
    'Tester izolacji',
    'Walizka narzędziowa 150 elementów',
    'Klucze dynamometryczne',
    'Oscyloskop cyfrowy',
    'Lutownica stacyjna',
    'Miernik temperatury',
    'Manometr do gazów'
];

const vehicleModels = [
    'Ford Transit', 'Volkswagen Crafter', 'Mercedes Sprinter', 
    'Iveco Daily', 'Fiat Ducato', 'Peugeot Boxer'
];

const updatedEmployees = employees.map((employee, index) => {
    console.log(`⚙️  Aktualizuję pracownika ${index + 1}/${employees.length}: ${employee.name}`);
    
    // Określ czy to specjalista AGD
    const isAGDSpecialist = employee.specializations?.some(s => 
        s.toLowerCase().includes('agd') || 
        s.toLowerCase().includes('pral') ||
        s.toLowerCase().includes('zmyw') ||
        s.toLowerCase().includes('lodó')
    );
    
    return {
        ...employee,
        
        // SPECJALIZACJE AGD (szczegółowe)
        agdSpecializations: isAGDSpecialist ? {
            primaryCategory: 'AGD',
            devices: agdTypes.slice(0, Math.floor(Math.random() * 4) + 2).map(type => ({
                type: type,
                brands: agdBrands.slice(0, Math.floor(Math.random() * 4) + 2),
                experienceYears: Math.floor(Math.random() * 8) + 1,
                level: ['beginner', 'intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 4)],
                certifications: certifications.slice(0, Math.floor(Math.random() * 3) + 1)
            })),
            specialSkills: [
                'Diagnostyka elektroniczna',
                'Naprawa układów chłodniczych', 
                'Serwis silników elektrycznych',
                'Programowanie kontrolerów',
                'Obsługa systemów gazowych'
            ].slice(0, Math.floor(Math.random() * 3) + 1)
        } : null,
        
        // WYPOSAŻENIE I NARZĘDZIA
        equipment: {
            personalTools: tools.slice(0, Math.floor(Math.random() * 6) + 4),
            specializedEquipment: isAGDSpecialist ? [
                'Analizator parametrów sieci',
                'Tester silników elektrycznych', 
                'Zestaw do obsługi układów chłodniczych',
                'Kamera termowizyjna'
            ].slice(0, Math.floor(Math.random() * 3) + 1) : [],
            mobileWorkshop: true,
            toolsValue: Math.floor(Math.random() * 15000) + 5000,
            lastInventoryCheck: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        
        // POJAZD SERWISOWY
        vehicle: {
            make: vehicleModels[Math.floor(Math.random() * vehicleModels.length)].split(' ')[0],
            model: vehicleModels[Math.floor(Math.random() * vehicleModels.length)].split(' ')[1] || 'Transit',
            year: 2020 + Math.floor(Math.random() * 5),
            licensePlate: `WA${Math.floor(Math.random() * 90000) + 10000}`,
            fuelType: ['diesel', 'petrol', 'electric'][Math.floor(Math.random() * 3)],
            capacity: {
                volume: Math.floor(Math.random() * 8) + 8 + 'm³',
                weight: Math.floor(Math.random() * 1000) + 1000 + 'kg'
            },
            features: [
                'Klimatyzacja',
                'Regały na narzędzia',
                'Oświetlenie LED',
                'Gniazdka 230V',
                'System GPS'
            ].slice(0, Math.floor(Math.random() * 4) + 2),
            mileage: Math.floor(Math.random() * 100000) + 20000,
            nextService: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        
        // OBSZAR DZIAŁANIA
        serviceArea: {
            primaryCity: employee.address || 'Warszawa',
            radius: [15, 20, 25, 30, 35][Math.floor(Math.random() * 5)],
            preferredDistricts: [
                'Mokotów', 'Ursynów', 'Wilanów', 'Ochota', 'Wola',
                'Śródmieście', 'Żoliborz', 'Bielany', 'Targówek'
            ].slice(0, Math.floor(Math.random() * 4) + 2),
            maxDistanceKm: Math.floor(Math.random() * 20) + 30,
            avoidAreas: Math.random() > 0.7 ? ['Centrum w godzinach szczytu'] : [],
            travelTimePreference: 'minimize'
        },
        
        // WYDAJNOŚĆ I STATYSTYKI (rozszerzone)
        performance: {
            ...employee.performance,
            monthlyStats: {
                completedOrders: Math.floor(Math.random() * 30) + 15,
                averageTimePerOrder: Math.floor(Math.random() * 60) + 90,
                customerSatisfaction: (Math.random() * 1.5 + 3.5).toFixed(1),
                onTimeArrival: Math.floor(Math.random() * 20) + 80,
                firstTimeFixRate: Math.floor(Math.random() * 30) + 70,
                repeatCustomers: Math.floor(Math.random() * 40) + 30
            },
            specialtyMetrics: isAGDSpecialist ? {
                agdRepairSuccess: Math.floor(Math.random() * 20) + 80,
                complexRepairCapability: Math.floor(Math.random() * 30) + 60,
                partsOrderAccuracy: Math.floor(Math.random() * 15) + 85,
                diagnosticAccuracy: Math.floor(Math.random() * 20) + 75
            } : null
        },
        
        // DOSTĘPNOŚĆ (szczegółowa)
        availability: {
            ...employee.availability,
            vacationDays: {
                total: 26,
                used: Math.floor(Math.random() * 15),
                planned: [
                    Math.random() > 0.7 ? {
                        from: '2025-11-15',
                        to: '2025-11-22',
                        reason: 'Urlop wypoczynkowy'
                    } : null
                ].filter(Boolean)
            },
            overtime: {
                maxHoursPerWeek: 10,
                currentWeekHours: Math.floor(Math.random() * 8),
                overtimeRate: 1.5
            },
            emergencyAvailability: Math.random() > 0.3
        },
        
        // CERTYFIKATY I UPRAWNIENIA
        certifications: {
            current: isAGDSpecialist ? [
                {
                    name: 'Uprawnienia elektryczne do 1kV',
                    issuer: 'UDT',
                    validUntil: '2026-05-15',
                    level: 'E'
                },
                {
                    name: 'Obsługa urządzeń gazowych',
                    issuer: 'Gazownictwo',
                    validUntil: '2025-12-20',
                    level: 'II'
                }
            ] : [],
            required: isAGDSpecialist ? [
                'Uprawnienia elektryczne',
                'Bezpieczeństwo pracy'
            ] : [],
            inProgress: Math.random() > 0.6 ? ['Nowe technologie AGD 2025'] : []
        },
        
        // METADANE (aktualizowane)
        metadata: {
            createdAt: employee.dateAdded || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastModifiedBy: 'enhancement-script-v2',
            version: 2,
            dataCompleteness: 'enhanced',
            enhancementDate: new Date().toISOString(),
            profileCompleteness: isAGDSpecialist ? 95 : 75
        }
    };
});

// Zapisz zaktualizowane dane
fs.writeFileSync(employeesFile, JSON.stringify(updatedEmployees, null, 2));

console.log('✅ UKOŃCZONO: Aktualizacja employees.json');
console.log(`👷 Zaktualizowano ${updatedEmployees.length} pracowników`);
console.log(`📋 Dodano pola: agdSpecializations, equipment, vehicle, serviceArea, certifications`);
console.log(`💾 Plik zapisany: ${employeesFile}`);
console.log('');

// STATYSTYKI
const agdSpecialistsCount = updatedEmployees.filter(e => e.agdSpecializations).length;
const withVehicleCount = updatedEmployees.filter(e => e.vehicle).length;
const certifiedCount = updatedEmployees.filter(e => e.certifications?.current?.length > 0).length;

console.log('📈 STATYSTYKI:');
console.log(`🔧 Specjaliści AGD: ${agdSpecialistsCount} (${Math.round(agdSpecialistsCount/updatedEmployees.length*100)}%)`);
console.log(`🚐 Z pojazdami: ${withVehicleCount} (${Math.round(withVehicleCount/updatedEmployees.length*100)}%)`);
console.log(`📜 Z certyfikatami: ${certifiedCount} (${Math.round(certifiedCount/updatedEmployees.length*100)}%)`);
console.log('');
console.log('🎯 NASTĘPNY KROK: Uruchom skrypt 3 - aktualizację orders.json');