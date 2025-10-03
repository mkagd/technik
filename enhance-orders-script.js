const fs = require('fs');
const path = require('path');

// SKRYPT 3: UZUPEŁNIENIE ORDERS.JSON O SPECJALISTYCZNE POLA AGD

console.log('🔧 SKRYPT 3: Uzupełnianie zamówień o specjalistyczne pola AGD...');

const ordersFile = path.join(__dirname, 'data', 'orders.json');
const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));

console.log(`📋 Znaleziono ${orders.length} zamówień do aktualizacji`);

// Baza danych części zamiennych dla AGD
const commonParts = {
    'pralka': [
        { name: 'Łożysko bębna', partNumber: 'DC97-16151A', price: 85, probability: 0.3 },
        { name: 'Pompa odpływowa', partNumber: 'DC96-01414G', price: 120, probability: 0.4 },
        { name: 'Pasek napędowy', partNumber: '6PH1871', price: 35, probability: 0.2 },
        { name: 'Elektrozawór', partNumber: 'DC62-00024A', price: 65, probability: 0.25 },
        { name: 'Amortyzator', partNumber: 'DC66-00343A', price: 45, probability: 0.15 }
    ],
    'zmywarka': [
        { name: 'Pompa myjąca', partNumber: 'DW-PUMP-001', price: 180, probability: 0.35 },
        { name: 'Ramię spryskujące dolne', partNumber: 'DW-ARM-BOT', price: 75, probability: 0.2 },
        { name: 'Filtr pompy', partNumber: 'DW-FILTER-01', price: 25, probability: 0.4 },
        { name: 'Czujnik mętności', partNumber: 'DW-SENS-TUR', price: 95, probability: 0.15 }
    ],
    'lodówka': [
        { name: 'Termostat', partNumber: 'FR-THERM-01', price: 85, probability: 0.3 },
        { name: 'Wentylator', partNumber: 'FR-FAN-001', price: 120, probability: 0.25 },
        { name: 'Uszczelka drzwi', partNumber: 'FR-SEAL-DR', price: 55, probability: 0.2 },
        { name: 'Lampka LED', partNumber: 'FR-LED-001', price: 35, probability: 0.15 }
    ],
    'piekarnik': [
        { name: 'Element grzejny górny', partNumber: 'OV-HEAT-TOP', price: 95, probability: 0.4 },
        { name: 'Element grzejny dolny', partNumber: 'OV-HEAT-BOT', price: 95, probability: 0.35 },
        { name: 'Termostat bezpieczeństwa', partNumber: 'OV-SAFE-TH', price: 65, probability: 0.2 },
        { name: 'Uszczelka drzwi', partNumber: 'OV-SEAL-DR', price: 45, probability: 0.25 }
    ]
};

const riskFactors = {
    'electrical': ['wysokie napięcie', 'ryzyko porażenia', 'sprawdzenie instalacji'],
    'water': ['ryzyko zalania', 'ciśnienie wody', 'sprawdzenie połączeń'],
    'gas': ['ryzyko wycieku', 'sprawdzenie szczelności', 'wentylacja'],
    'mechanical': ['ciężkie elementy', 'ostre krawędzie', 'ruchome części'],
    'chemical': ['detergenty', 'środki chłodnicze', 'środki ochronne']
};

const updatedOrders = orders.map((order, index) => {
    console.log(`⚙️  Aktualizuję zamówienie ${index + 1}/${orders.length}: ${order.id}`);
    
    // Określ czy to AGD na podstawie kategorii urządzeń
    const isAGDOrder = order.devices?.some(device => 
        device.category === 'AGD' || 
        ['pralka', 'zmywarka', 'lodówka', 'piekarnik'].includes(device.type?.toLowerCase())
    );
    
    return {
        ...order,
        
        // SPECJALISTYCZNE POLA AGD
        agdSpecific: isAGDOrder ? {
            warrantyStatus: Math.random() > 0.6 ? 'active' : 'expired',
            warrantyValidUntil: Math.random() > 0.6 ? '2025-12-31' : null,
            lastServiceDate: Math.random() > 0.7 ? 
                new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                : null,
            installationRequired: Math.random() > 0.7,
            gasConnectionRequired: order.devices?.some(d => d.type?.toLowerCase().includes('piec')) || Math.random() > 0.9,
            waterConnectionRequired: order.devices?.some(d => 
                ['pralka', 'zmywarka'].includes(d.type?.toLowerCase())) || Math.random() > 0.8,
            specialAccessRequirements: Math.random() > 0.7 ? [
                'Wąskie drzwi - max 70cm',
                'Brak windy - 3 piętro',
                'Dostęp przez balkon',
                'Ciasna kuchnia'
            ][Math.floor(Math.random() * 4)] : null,
            environmentalFactors: {
                humidity: Math.random() > 0.8 ? 'high' : 'normal',
                temperature: 'normal',
                dustLevel: Math.random() > 0.9 ? 'high' : 'low',
                vibrationSensitive: Math.random() > 0.8
            }
        } : null,
        
        // INWENTARYZACJA CZĘŚCI
        partsInventory: isAGDOrder && order.devices ? {
            estimatedParts: order.devices.flatMap(device => {
                const deviceType = device.type?.toLowerCase();
                const partsForDevice = commonParts[deviceType] || [];
                return partsForDevice
                    .filter(part => Math.random() < part.probability)
                    .map(part => ({
                        ...part,
                        deviceId: device.name,
                        urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                        availability: ['in-stock', 'order-needed', '24h-delivery'][Math.floor(Math.random() * 3)],
                        supplier: ['Samsung Parts', 'LG Service', 'Bosch Original', 'Universal Parts'][Math.floor(Math.random() * 4)]
                    }));
            }),
            totalEstimatedCost: 0, // Będzie obliczone poniżej
            orderRequired: Math.random() > 0.6,
            deliveryTime: ['same-day', '24h', '48h', '3-5-days'][Math.floor(Math.random() * 4)]
        } : null,
        
        // OCENA RYZYKA
        riskAssessment: isAGDOrder ? {
            overallRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            identifiedRisks: Object.keys(riskFactors)
                .filter(() => Math.random() > 0.7)
                .slice(0, 2),
            safetyMeasures: [
                'Wyłączenie zasilania głównego',
                'Sprawdzenie braku napięcia',
                'Użycie sprzętu ochronnego',
                'Zabezpieczenie obszaru pracy',
                'Wentylacja pomieszczenia'
            ].slice(0, Math.floor(Math.random() * 3) + 2),
            requiredCertifications: Math.random() > 0.8 ? [
                'Uprawnienia elektryczne',
                'Obsługa gazowa'
            ].filter(() => Math.random() > 0.5) : [],
            insuranceCoverage: true,
            emergencyProcedures: [
                'Kontakt z dyspozytorem',
                'Wyłączenie głównych zaworów',
                'Ewakuacja w razie potrzeby'
            ]
        } : null,
        
        // WYMAGANIA INSTALACYJNE (dla AGD)
        installationRequirements: isAGDOrder ? {
            electricalRequirements: {
                voltage: '230V',
                maxCurrent: Math.floor(Math.random() * 10) + 10 + 'A',
                earthingRequired: true,
                separateCircuit: Math.random() > 0.7
            },
            plumbingRequirements: order.devices?.some(d => 
                ['pralka', 'zmywarka'].includes(d.type?.toLowerCase())) ? {
                waterPressure: '0.1-1.0 MPa',
                drainageRequired: true,
                shutoffValves: true
            } : null,
            ventilationRequirements: Math.random() > 0.8 ? {
                minAirflow: '50 m³/h',
                exhaustRequired: true
            } : null,
            spaceRequirements: {
                minWidth: Math.floor(Math.random() * 20) + 60 + 'cm',
                minDepth: Math.floor(Math.random() * 20) + 60 + 'cm',
                minHeight: Math.floor(Math.random() * 50) + 150 + 'cm',
                clearanceRequired: '5cm ze wszystkich stron'
            }
        } : null,
        
        // INFORMACJE TECHNICZNE
        technicalInfo: isAGDOrder ? {
            diagnosticData: {
                errorCodes: Math.random() > 0.6 ? [
                    'E01 - Problem z pompą',
                    'E04 - Czujnik temperatury'
                ].slice(0, Math.floor(Math.random() * 2) + 1) : [],
                symptoms: [
                    order.service?.description || 'Standardowa naprawa'
                ],
                preliminaryDiagnosis: [
                    'Zużyte łożysko',
                    'Zablokowana pompa',
                    'Uszkodzony czujnik'
                ][Math.floor(Math.random() * 3)]
            },
            repairHistory: Math.random() > 0.8 ? [
                {
                    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    issue: 'Wymiana filtra',
                    cost: Math.floor(Math.random() * 200) + 100
                }
            ] : [],
            maintenanceRecommendations: [
                'Czyszczenie filtra co 3 miesiące',
                'Sprawdzenie węży co 6 miesięcy',
                'Kontrola poziomu detergentu'
            ].slice(0, Math.floor(Math.random() * 2) + 1)
        } : null,
        
        // METADANE (aktualizowane)
        metadata: {
            ...order.metadata,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: 'enhancement-script-v3',
            version: (order.metadata?.version || 0) + 1,
            enhancementDate: new Date().toISOString(),
            isAGDOrder: isAGDOrder,
            dataCompleteness: isAGDOrder ? 'enhanced-agd' : 'standard'
        }
    };
});

// Oblicz koszty części dla zamówień z inwentaryzacją
updatedOrders.forEach(order => {
    if (order.partsInventory?.estimatedParts) {
        order.partsInventory.totalEstimatedCost = order.partsInventory.estimatedParts
            .reduce((sum, part) => sum + part.price, 0);
    }
});

// Zapisz zaktualizowane dane
fs.writeFileSync(ordersFile, JSON.stringify(updatedOrders, null, 2));

console.log('✅ UKOŃCZONO: Aktualizacja orders.json');
console.log(`📋 Zaktualizowano ${updatedOrders.length} zamówień`);
console.log(`📋 Dodano pola: agdSpecific, partsInventory, riskAssessment, installationRequirements, technicalInfo`);
console.log(`💾 Plik zapisany: ${ordersFile}`);
console.log('');

// STATYSTYKI
const agdOrdersCount = updatedOrders.filter(o => o.agdSpecific).length;
const withPartsCount = updatedOrders.filter(o => o.partsInventory).length;
const highRiskCount = updatedOrders.filter(o => o.riskAssessment?.overallRisk === 'high').length;
const warrantyActiveCount = updatedOrders.filter(o => o.agdSpecific?.warrantyStatus === 'active').length;

console.log('📈 STATYSTYKI:');
console.log(`🔧 Zamówienia AGD: ${agdOrdersCount} (${Math.round(agdOrdersCount/updatedOrders.length*100)}%)`);
console.log(`🔩 Z częściami: ${withPartsCount} (${Math.round(withPartsCount/updatedOrders.length*100)}%)`);
console.log(`⚠️  Wysokie ryzyko: ${highRiskCount} (${Math.round(highRiskCount/updatedOrders.length*100)}%)`);
console.log(`🛡️  Aktywna gwarancja: ${warrantyActiveCount} z ${agdOrdersCount} AGD`);
console.log('');
console.log('🎯 NASTĘPNY KROK: Uruchom skrypt 4 - utworzenie bazy części zamiennych');